export interface ImagePath{
    type: string,
    filePath: string
}
export interface Book{
    id: string,
    title: string,
    author?: string,
    isbn?: string,
    coverImage?: ImagePath,
    searchText?: string,
    lent?: string,
    rating?: string,
    pageCount?: string,
    description?: string,
    publisher?: string,
    year?: string,
    shelf?: string,
}
export interface BookResults{
    book: Book,
    shouldImport: boolean,
    listType: string,
    duplicateMsg: string,
}
export interface AuthorImgByIsbn{
    _: Array<string>
}
export interface AuthorDataArrByIsbn{
    average_rating: Array<string>,
    name: Array<string>,
    id: Array<string>,
    image_url: Array<AuthorImgByIsbn>
}
export interface AuthorArrByIsbn{
    author: Array<AuthorDataArrByIsbn>
}
export interface SearchResultByIsbn{
    id: Array<string>,
    title: Array<string>,
    isbn: Array<string>,
    isbn13: Array<string>,
    image_url: Array<string>,
    small_image_url: Array<string>,
    publication_year: Array<string>,
    publisher: Array<string>,
    description: Array<string>,
    num_pages: Array<string>,
    authors: Array<AuthorArrByIsbn>
    average_rating: Array<string>,
}
export interface GoodreadsResponseByIsbn{
    Request: Array<any>,
    book: Array<SearchResultByIsbn>,
}
export interface GoodreadResultsByIsbn{
    GoodreadsResponse: GoodreadsResponseByIsbn
}

///////////////
export interface BookNumber{
    _: string
}
export interface GoodreadAuthorByTitle{
    name: Array<string>
}
export interface GoodreadBookByTitle{
    author: Array<GoodreadAuthorByTitle>
    image_url: Array<string>,
    small_image_url: Array<string>,
    title: Array<string>
    id: Array<BookNumber>
}
export interface GoodreadDataByTitle{
    average_rating: Array<string>,
    original_publication_year: Array<string>,
    best_book: Array<GoodreadBookByTitle>,
}
export interface GoodreadResultByTitle{
    work: Array<GoodreadDataByTitle>
}
export interface SearchResultByTitle{
    query: Array<string>,
    "total-results": Array<string>,
    results: Array<GoodreadResultByTitle>
}
export interface GoodreadsResponseByTitle{
    Request: Array<any>,
    search: Array<SearchResultByTitle>,
}
export interface GoodreadResultsByTitle{
    GoodreadsResponse: GoodreadsResponseByTitle
}